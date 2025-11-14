'use client'

import { useState, useEffect } from 'react'
import styles from './nameInput.module.css'
import { supabase } from '../utils/supabase/client'
import { PostgrestError, User } from '@supabase/supabase-js'

interface NameInputProps {
  user: User | null
  disabled?: boolean
}

export default function NameInput({ user, disabled = false }: NameInputProps) {
  const [currentName, setCurrentName] = useState('Anonymous')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        if (!error && data) {
          setCurrentName(data.username)
        }
      }
      fetchProfile()
    }
  }, [user])

  const handleEditClick = async () => {
    if (isEditing) {
      // Update mode - save the new name
      const newName = editValue.trim() || currentName
      setCurrentName(newName)
      setIsEditing(false)
      setEditValue('')
      if (user) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: newName })
          .eq('id', user.id)
        if (profileError) {
          setError(profileError.message)
          setCurrentName(currentName)
          return
        }

        const newEmail = `${newName}@theisaaccompany.ca`
        try {
          const res = await fetch('/api/update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, newEmail }),
          })

          const data = await res.json()
          if (!res.ok) throw data.error
          setError(null)
        } catch (err: PostgrestError | any) {
          setError(err.message || 'Failed to update email')
          // revert profile if email update fails
          await supabase.from('profiles').update({ username: currentName }).eq('id', user.id)
          setCurrentName(currentName)
        }
      }
    } else {
      // Edit mode - prepare for editing
      setEditValue('')
      setIsEditing(true)
      setError(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditClick()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue('')
    }
  }

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.content}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={currentName}
              className={styles.input}
              autoFocus
              maxLength={20}
            />
            <button
              onClick={handleEditClick}
              className={styles.button}
            >
              Update
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={currentName}
              readOnly
              className={styles.input}
            />
            <button
              onClick={handleEditClick}
              className={styles.button}
            >
              Change
            </button>
          </>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}