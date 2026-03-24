// 앱 로딩 중일 때 표시 (로딩만 도는 것처럼 보이는 현상 완화)
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm">로딩 중...</p>
    </div>
  );
}
