import { redirect } from "next/navigation";

// ルートページはカレンダー設定ページへリダイレクト
export default function Home() {
  redirect("/calendar-setup");
}
