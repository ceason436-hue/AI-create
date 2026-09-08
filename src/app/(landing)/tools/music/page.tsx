import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import styles from "../tools.module.css";

const exercises = [
  { name: "节奏实验", href: "/tools/music/rhythm", detail: "跟着声音拍出稳定节奏，观察速度与重拍如何改变听感。" },
  { name: "音高探索", href: "/tools/music/pitch", detail: "听见音高之间的距离，为旋律建立最初的方向感。" },
  { name: "旋律工坊", href: "/tools/music/melody", detail: "排列、试听并修改音符，把一个小动机发展成旋律。" },
  { name: "三键成曲", href: "/tools/music/three-keys", detail: "用有限的选择完成音乐片段，体会约束如何帮助创作。" },
];

export default function MusicExercisesPage() {
  return (
    <PublicShell>
      <main className={`${styles.page} ${styles.musicPage}`}>
        <span className={styles.eyebrow}>AI music · 音乐基础</span>
        <h1>先听见规律，<br />再和 AI 一起写歌。</h1>
        <p className={styles.musicLead}>四个短练习帮助孩子理解节奏、音高与旋律。完成热身后，可以继续进入 AI 音乐，把自己的选择发展成一首完整作品。</p>
        <div className={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <Link href={exercise.href} key={exercise.href} className={styles.exercise}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{exercise.name}</strong><p>{exercise.detail}</p></div>
              <b>开始练习 →</b>
            </Link>
          ))}
        </div>
        <Link className={styles.back} href="/tools/ai-music">完成热身，进入 AI 音乐 →</Link>
      </main>
    </PublicShell>
  );
}
