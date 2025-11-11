'use client'

import { useState, useEffect } from 'react'
import styles from './nameInput.module.css'
import { supabase } from '../utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface NameInputProps {
  user: User | null
  disabled?: boolean
}

export default function NameInput({ user, disabled = false }: NameInputProps) {
  const [currentName, setCurrentName] = useState('Anonymous')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

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
          console.error('Error updating username:', profileError)
          return
        }

        // Update auth email
        const newEmail = `${newName}@theisaaccompany.ca`
        console.log('Updating email to:', newEmail)
        const { error: authError } = await supabase.auth.updateUser({ email: newEmail })
        if (authError) {
          console.error('Error updating auth email:', authError)
          // Optionally revert profile update
          await supabase
            .from('profiles')
            .update({ username: currentName })
            .eq('id', user.id)
          setCurrentName(currentName)
        }
      }
    } else {
      // Edit mode - prepare for editing
      setEditValue('')
      setIsEditing(true)
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
    </div>
  )
}