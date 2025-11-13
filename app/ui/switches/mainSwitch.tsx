'use client'

import { useState, useEffect, useRef } from "react"
import styles from "./mainSwitch.module.css"
import { supabase } from "../../utils/supabase/client";
import { User } from '@supabase/supabase-js';

interface MainSwitchProps {
  user: User | null
}

export default function MainSwitch({ user }: MainSwitchProps) {
  const [isOn, setIsOn] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [total, setTotal] = useState<number|null>(null);
  const disabledRef = useRef(false);

  useEffect(() => {
    const fetchTotal = async () => {
      const { data, error } = await supabase
        .from('global_clicks')
        .select('total')
        .eq('button_name', 'mainSwitch')
        .single();
      if (!error && data) {
        setTotal(data.total);
        setIsOn(data.total % 2 === 1); // Set switch state based on whether total is odd/even
      }
    };
    fetchTotal();

    // setup real-time listener
    const subscription = supabase
      .channel('public:global_clicks') // channel name, anything unique
      .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'global_clicks',
            filter: `button_name=eq.mainSwitch`
        },
        (payload) => {
          const newTotal = (payload.new as { total: number }).total; // accessing payload.new.total but with type assertion to make TypeScript happy
          setTotal(newTotal);
          setIsOn(newTotal % 2 !== 0);

          // could do the cooldown thing here but lol we want the users to have fun (this is where the glitch happends)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  }, []);

  const incrementTotal = () => {
    const newTotal = (total ?? 0) + 1;
    setTotal(newTotal);
    setIsOn(newTotal % 2 !== 0);
  }

  const handleChange = async (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    setDisabled(true);
    disabledRef.current = true;

    incrementTotal();

    // Call the atomic RPC
    const { data: newTotal, error } = await supabase.rpc('click_button', {
      p_user_id: user.id,
      p_button_name: 'mainSwitch',
      p_increment: 1
    });

    if (error) {
      console.error("Error clicking button:", error);
    } else if (newTotal !== null) {
      setTotal(newTotal);
      setIsOn(newTotal % 2 !== 0);
    }

    disabledRef.current = false;
    setDisabled(false);
  };


  return (
    <div id="switchContainer" className="flex flex-col items-center">
      <div className="flex justify-center items-center">
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={isOn}
            disabled={disabled}
            onChange={handleChange}
            id="mainSwitch"
          />
          <div className={styles.button}>
            <div className={styles.light}></div>
            <div className={styles.dots}></div>
            <div className={styles.characters}></div>
            <div className={styles.shine}></div>
            <div className={styles.shadow}></div>
          </div>
        </label>
      </div>
      <h2 className="text-4xl font-bold mt-8" id="total">
        {total !== null  ? (
          <>Total Clicks: {total}</>
        ) : (
          <>Loading...</>
        )}
      </h2>
    </div>
  );
}
