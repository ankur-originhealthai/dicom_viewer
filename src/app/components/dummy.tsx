const handleDownloadWithAnnotations = () => {
    const viewport = renderingEngineRef.current?.getViewport(
      viewportId
    ) as StackViewport;
  if (!viewport) return;
  // Get image canvas (base image)
  const imageCanvas = viewport.getCanvas();
  // Get annotation canvas (from the annotation layer manager)
  const annotationCanvas = viewport.canvas; // ← this may contain annotations
  // Create a final canvas to merge both
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = imageCanvas.width;
  mergedCanvas.height = imageCanvas.height;
  const ctx = mergedCanvas.getContext('2d');
  // Draw base image
  ctx.drawImage(imageCanvas, 0, 0);
  // Draw annotations if available
  if (annotationCanvas) {
    ctx.drawImage(annotationCanvas, 0, 0);
  }
  // Export final merged canvas
  const dataUrl = mergedCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "viewport_with_annotations.png";
  link.click();
};