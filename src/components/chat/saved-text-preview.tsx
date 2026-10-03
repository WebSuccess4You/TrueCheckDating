import styles from "./saved-text-preview.module.css";

export function SavedTextPreview({ text }: { text: string }) {
  return (
    <pre className={styles.preview} data-testid="saved-text-preview">
      {text}
    </pre>
  );
}
