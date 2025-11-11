'use client'

 import { useState, useEffect } from 'react'
 import { supabase } from './utils/supabase/client'
 import { User } from '@supabase/supabase-js'
 import StatusBubble from "./ui/statusBubble";
 import MainSwitch from "./ui/switches/mainSwitch";
 import Leaderboard from "./ui/leaderboard";
 import NameInput from "./ui/nameInput";
 import Auth from "./ui/auth";

 export default function Home() {
   const [user, setUser] = useState<User | null>(null)
   const [loading, setLoading] = useState(true)

   useEffect(() => {
     const getSession = async () => {
       const { data: { session } } = await supabase.auth.getSession()
       setUser(session?.user ?? null)
       setLoading(false)
     }

     getSession()

     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (_event, session) => {
         setUser(session?.user ?? null)
       }
     )

     return () => subscription.unsubscribe()
   }, [])

   if (loading) {
     return <div>Loading...</div>
   }

   return (
     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
       <MainSwitch user={user} />
       {/* <div className="bubble-wrapper">
       <StatusBubble status="Connected Clickers: 0" color="limegreen"/>
       <StatusBubble status="Connected Clickers: 0" color="limegreen"/>
       </div> */}
       <NameInput user={user} />
       <Leaderboard />
       {!user && <Auth onAuthSuccess={async () => {
         const { data: { user: newUser } } = await supabase.auth.getUser()
         setUser(newUser)
       }} />}
     </div>
   );
 }
