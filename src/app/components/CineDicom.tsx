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
import registerLoader from "@cornerstonejs/dicom-image-loader";

const renderingEngineId = "myRenderingEngine";
const viewportId = "myViewport";
const toolGroupId = "myToolGroup";
export default function DicomViewer() {
  const elementRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const renderingEngineRef = useRef<RenderingEngine | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameCount, setFrameCount] = useState(1);

  const fetchDicomFile = async () => {
    const response = await fetch("/dicom_1.dcm");
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
      const imageBlob = await fetchDicomFile();
      const baseImageId = wadouri.fileManager.add(imageBlob);

      
      await imageLoader.loadImage(baseImageId);
      const metadata = metaData.get('multiframeModule', baseImageId)
      const numberOfFrames = metadata.NumberOfFrames
      setFrameCount(numberOfFrames)
      const imageIds = [];
      for (let i = 0; i < numberOfFrames; i++) {
        imageIds.push(`${baseImageId}?frame=${i}`);
      }
      await viewport.setStack(imageIds);
      
      console.log(metadata)
      console.log(imageIds);

      // const imageIds = [];
      // const tempid = "dicomfile:0?frame=0"
      
      // const data = metaData.get('multiframeModule', tempid)
      
      // const numberOfFrames = data.NumberOfFrames;
      // console.log(numberOfFrames)
      // setFrameCount(numberOfFrames)

      // for (let i = 0; i < numberOfFrames; i++) {
      //   imageIds.push(`${baseImageId}?frame=${i}`);
      // }
      
      // console.log(data)
      // console.log(imageIds);
      // await viewport.setStack(imageIds);
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
    if (!toolGroup) return;
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
    const viewport = renderingEngineRef.current?.getViewport(viewportId);
    viewport?.render();
  };
  const handlePlay = () => {
    const viewport = renderingEngineRef.current?.getViewport(
      viewportId
    ) as StackViewport;
    //viewport?.playClip(10); // 10 FPS
  };
  const handleStop = () => {
    const viewport = renderingEngineRef.current?.getViewport(
      viewportId
    ) as StackViewport;
    //viewport?.stopClip();
  };
  const handleFrameChange = (index: number) => {
    const viewport = renderingEngineRef.current?.getViewport(
      viewportId
    ) as StackViewport;
    viewport?.setImageIdIndex(index);
    viewport?.render();
    setFrameIndex(index);
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h2 className="text-xl font-bold mb-4">Cornerstone DICOM Viewer</h2>
      {loaded && (
        <>
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
          <div className="flex gap-4 mb-4">
            <button
              onClick={handlePlay}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
            >
              Play
            </button>
            <button
              onClick={handleStop}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-500"
            >
              Pause
            </button>
          </div>
          {frameCount > 1 && (
            <div className="w-full max-w-md mb-4">
              <input
                type="range"
                min={0}
                max={frameCount - 1}
                value={frameIndex}
                onChange={(e) => handleFrameChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm mt-1">
                Frame: {frameIndex + 1} / {frameCount}
              </div>
            </div>
          )}
        </>
      )}
      <div
        ref={elementRef}
        className="border border-gray-500"
        style={{ width: "700px", height: "700px", touchAction: "none" }}
      />
      <button
        onClick={() => {
          const ann = annotation.state.getAllAnnotations();
          console.log(ann);
        }}
        className="mt-4 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
      >
        Get Measurements
      </button>
    </div>
  );
}
