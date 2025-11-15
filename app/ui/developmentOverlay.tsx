import styles from './developmentOverlay.module.css'

export default function DevelopmentOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>GAME IN DEVELOPMENT</h1>
        <p className={styles.description}>
          Isaac is working on the game and it will be playable shortly.
        </p>
      </div>
    </div>
  )
}