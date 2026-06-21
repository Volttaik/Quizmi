export async function shareContent(options: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "error"> {
  const shareUrl = options.url ?? window.location.href;
  
  if (navigator.share) {
    try {
      await navigator.share({ title: options.title, text: options.text, url: shareUrl });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "error";
    }
  }

  try {
    await navigator.clipboard.writeText(`${options.title}\n\n${options.text}\n\n${shareUrl}`);
    return "copied";
  } catch {
    return "error";
  }
}
