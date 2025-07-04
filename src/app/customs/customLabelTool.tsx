"use client";
import { useEffect } from "react";
import {
  annotation,
  ToolGroupManager,
  addTool,
  LabelTool,
} from "@cornerstonejs/tools";
import {
  getRenderingEngine,
  metaData,
  RenderingEngine,
} from "@cornerstonejs/core";
import type { StackViewport } from "@cornerstonejs/core";
type Props = {
  element: HTMLDivElement | null;
  viewportId: string;
  renderingEngineId: string;
  toolGroupId: string;
};
const CustomLabelHandler = ({
  element,
  viewportId,
  renderingEngineId,
  toolGroupId,
}: Props) => {
  useEffect(() => {
    if (!element) return;
    // :wrench: Register and enable the built-in LabelTool
    addTool(LabelTool);
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup?.hasTool("Label")) {
      toolGroup?.addTool("Label");
      toolGroup?.setToolEnabled("Label");
    }
    const handleDoubleClick = (evt: MouseEvent) => {
      try {
        const renderingEngine: RenderingEngine | undefined =
          getRenderingEngine(renderingEngineId);
        const viewport = renderingEngine?.getViewport(
          viewportId
        ) as StackViewport;
        if (!viewport) return;
        const imageIds = viewport.getImageIds();
        const current = viewport.getCurrentImageIdIndex();
        const imageId = imageIds[current];
        if (!imageId) return;
        const rect = element.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const label = prompt("Enter label text:");
        if (!label) return;
        const annotationUID = crypto.randomUUID();
        const annotationGroup = "default";
        // :white_check_mark: Add annotation using the built-in Label tool
        annotation.state.addAnnotation(
          {
            annotationUID,
            metadata: {
              toolName: "LabelTool", 
              FrameOfReferenceUID:
                metaData.get("instance", imageId)?.FrameOfReferenceUID || "custom",
              referencedImageId: imageId,
              viewPlaneNormal: [0, 0, 1],
              viewUp: [0, -1, 0],
            },
            data: {
              text: label,
              handles: {
                points: [[x, y, 0], [x, y, 0]],
                activeHandleIndex: null,
              },
            },
          },
          annotationGroup
        );
       
    
        //triggerAnnotationRenderForElement(element);
      } catch (error) {
        console.error("Error adding label annotation:", error);
      }
    };
    element.addEventListener("dblclick", handleDoubleClick);
    return () => {
      element.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [element, viewportId, renderingEngineId, toolGroupId]);
  return null;
};
export default CustomLabelHandler;









