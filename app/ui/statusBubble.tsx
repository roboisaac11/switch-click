"use client";

import styles from "./statusBubble.module.css";

interface StatusBubbleProps {
  status?: string;
  color?: string;
  index?: number;
}

export default function StatusBubble({ status = "OK", color = "green" }: StatusBubbleProps) {

  return (
    <div
      className={styles.container}
    >
      <span className={styles.dot} style={{ backgroundColor: color }}></span>
      <span className={styles.text}>{status}</span>
    </div>
  );
}