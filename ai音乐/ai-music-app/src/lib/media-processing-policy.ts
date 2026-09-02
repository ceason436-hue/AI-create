export const VIDEO_PROCESSING_PENDING = "PENDING";
export const VIDEO_PROCESSING_READY = "READY";

export function initialMediaProcessingStatus(mimeType: string) {
  return mimeType.startsWith("video/") ? VIDEO_PROCESSING_PENDING : VIDEO_PROCESSING_READY;
}

export function publicPlaybackObjectKey(asset: { objectKey: string | null; playbackObjectKey: string | null; processingStatus: string }) {
  if (asset.processingStatus === VIDEO_PROCESSING_READY && asset.playbackObjectKey) return asset.playbackObjectKey;
  return asset.objectKey;
}
