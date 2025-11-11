'use client'

import { useState, useEffect } from 'react'
import styles from './leaderboard.module.css'
import { supabase } from '../utils/supabase/client'

interface LeaderboardEntry {
  id: string
  name: string
  clicks: number
}

interface LeaderboardProps {
  disabled?: boolean
}

export default function Leaderboard({ disabled = false }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, total_clicks')
      .order('total_clicks', { ascending: false })
      .limit(10)
    if (!error && data) {
      setEntries(data.map(p => ({ id: p.id, name: p.username, clicks: p.total_clicks })))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard()

    // Setup real-time listener for profiles updates
    const subscription = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchLeaderboard() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  return (
    <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ''} ${disabled ? styles.disabled : ''}`}>
      <h3 className={styles.title}>Leaderboard</h3>
      <button
        className={styles.toggleButton}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand leaderboard' : 'Collapse leaderboard'}
      >
        {isCollapsed ? '▽' : '△'}
      </button>

      {!isCollapsed && (
        <div className={styles.content}>
          <div className={styles.list}>
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : entries.length > 0 ? (
              entries.map((entry, index) => (
                <div key={entry.id} className={styles.entry}>
                  <span className={styles.rank}>#{index + 1}</span>
                  <span className={styles.name}>{entry.name}</span>
                  <span className={styles.clicks}>{entry.clicks}</span>
                </div>
              ))
            ) : (
              <div className={styles.empty}>No entries yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}