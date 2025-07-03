"use client";
import { useEffect, useRef, useState } from "react";
import {
  RenderingEngine,
  Enums,
  imageLoader,
  metaData,
  StackViewport,
  init as cornerstoneCoreInit,
} from "@cornerstonejs/core";
import {
  init as cornerstoneToolsInit,
  ToolGroupManager,
  Enums as csToolsEnums,
  addTool,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  AngleTool,
  annotation,
} from "@cornerstonejs/tools";
import hardcodedMetaDataProvider from "../lib/hardcodedMetaDataProvider";
import { Annotation } from "@cornerstonejs/tools/types";
import { state as AnnotationState } from "@cornerstonejs/tools";
const renderingEngineId = "myRenderingEngine";
const viewportId = "myViewport";
const toolGroupId = "myToolGroup";

export default function DicomViewer() {
  const elementRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const fetchDicomFile = async () => {
    const response = await fetch("/image.dcm");
    return await response.blob();
  };

  useEffect(() => {
    const initialize = async () => {
      const { init: dicomLoaderInit, wadouri } = await import(
        "@cornerstonejs/dicom-image-loader"
      );

      await cornerstoneCoreInit();
      await dicomLoaderInit();
      await cornerstoneToolsInit();

      metaData.addProvider(
        (type, imageId) => hardcodedMetaDataProvider(type, imageId, imageId),
        10000
      );

      const imageBlob = await fetchDicomFile();
      const imageId = wadouri.fileManager.add(imageBlob);
      if (!elementRef.current) return;
      const element = elementRef.current;

      const renderingEngine = new RenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;
      renderingEngine.setViewports([
        {
          viewportId,
          type: Enums.ViewportType.STACK,
          element,
        },
      ]);
      const viewport = renderingEngine.getViewport(viewportId) as StackViewport;
      await viewport.setStack([imageId]);
      viewport.render();

      [
        PanTool,
        ZoomTool,
        WindowLevelTool,
        LengthTool,
        RectangleROITool,
        EllipticalROITool,
        AngleTool,
      ].forEach(addTool);

      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      if (!toolGroup) return;
      [
        PanTool,
        ZoomTool,
        WindowLevelTool,
        LengthTool,
        RectangleROITool,
        EllipticalROITool,
        AngleTool,
      ].forEach((Tool) => {
        toolGroup.addTool(Tool.toolName);
      });

      toolGroup.addViewport(viewportId, renderingEngineId);
      setLoaded(true);
    };
    initialize();
  }, []);

  const handleToolChange = (selectedToolName: string) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) {
      console.error("Tool group not found");
      return;
    }
    const allTools = [
      PanTool.toolName,
      ZoomTool.toolName,
      WindowLevelTool.toolName,
      LengthTool.toolName,
      RectangleROITool.toolName,
      EllipticalROITool.toolName,
      AngleTool.toolName,
    ];

    allTools.forEach((toolName) => {
      if (toolName === selectedToolName) {
        toolGroup.setToolActive(toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
        });
      } else {
        toolGroup.setToolPassive(toolName);
      }
    });
    const renderingEngine = renderingEngineRef.current;
    const viewport = renderingEngine?.getViewport(viewportId);
    viewport?.render();
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-xl font-bold mb-4">Cornerstone DICOM Viewer</h2>
      {loaded && (
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {[
            RectangleROITool,
            PanTool,
            ZoomTool,
            WindowLevelTool,
            LengthTool,
            EllipticalROITool,
            AngleTool,
          ].map((Tool) => (
            <button
              key={Tool.toolName}
              onClick={() => handleToolChange(Tool.toolName)}
              className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
            >
              {Tool.toolName}
            </button>
          ))}
        </div>
      )}
      <div
        ref={elementRef}
        className="border border-gray-500"
        style={{ width: "512px", height: "512px", touchAction: "none" }}
      />
      <button
        onClick={() => {
          const ann = annotation.state.getAllAnnotations()
          console.log(ann)
        }}
      >
        Get Measurements
      </button>
    </div>
  );
}
