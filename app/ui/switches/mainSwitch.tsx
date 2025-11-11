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

  const incrementTotal = (): number => {
    const newTotal = (total ?? 0) + 1;
    setTotal(newTotal);
    setIsOn(newTotal % 2 !== 0);
    return newTotal;
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabledRef.current || total === null || !user) {
      console.log("Click ignored: ", { disabled: disabledRef.current, total, user });
      return; // Currently disabled so just pretend nothing has happened
    }
    console.log("Switch clicked:", { disabled: disabledRef.current, total, user });
    disabledRef.current = true;

    // Disable then reenable after cooldown
    setDisabled(true);

    const checked = e.target.checked;
    setIsOn(checked);
    const newTotal = incrementTotal();


    // Parallel fetches and updates for better performance
    const globalPromise = supabase
      .from('global_clicks')
      .update({ total: newTotal })
      .eq('button_name', 'mainSwitch');

    const userSelectPromise = supabase
      .from('user_clicks')
      .select('count')
      .eq('user_id', user.id)
      .eq('button_name', 'mainSwitch')
      .single();

    const profileSelectPromise = supabase
      .from('profiles')
      .select('total_clicks')
      .eq('id', user.id)
      .single();

    const [{ data: existing, error: userSelectError }, { data: profileData, error: profileSelectError }] = await Promise.all([
      userSelectPromise,
      profileSelectPromise
    ]);

    if (userSelectError && userSelectError.code !== 'PGRST116') console.error("Error selecting user clicks:", userSelectError);
    if (profileSelectError) console.error("Error selecting profile:", profileSelectError);

    const newCount = (existing?.count || 0) + 1;
    const newTotalClicks = (profileData?.total_clicks || 0) + 1;

    const userUpdatePromise = supabase
      .from('user_clicks')
      .upsert({
        user_id: user.id,
        button_name: 'mainSwitch',
        count: newCount
      }, { onConflict: 'user_id,button_name' });

    const profileUpdatePromise = supabase
      .from('profiles')
      .update({ total_clicks: newTotalClicks })
      .eq('id', user.id);

    const [{ error: globalError }, { error: userError }, { error: profileError }] = await Promise.all([
      globalPromise,
      userUpdatePromise,
      profileUpdatePromise
    ]);

    if (globalError) console.error("Error updating global total in Supabase:", globalError);
    if (userError) console.error("Error updating user clicks:", userError);
    if (profileError) console.error("Error updating profile:", profileError);
    
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
