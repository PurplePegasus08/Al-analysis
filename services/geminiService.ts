import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// --- Tool Definitions ---

const generateVisualizationTool: FunctionDeclaration = {
  name: "generateVisualization",
  description: "Create a chart visualization based on the dataset.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { 
        type: Type.STRING, 
        enum: ["bar", "line", "scatter", "pie", "doughnut", "area", "heatmap", "bubble", "box", "venn", "contour"], 
        description: "The type of chart. Use 'venn' for set intersection, 'box' for distribution stats, 'bubble' for 3 variables, 'doughnut' for parts-to-whole." 
      },
      xAxisKey: { type: Type.STRING, description: "The column name for the X-axis (or Group by)." },
      yAxisKey: { type: Type.STRING, description: "The column name for the Y-axis. For Bubble/Scatter, this is the vertical value." },
      zAxisKey: { type: Type.STRING, description: "The column name for the Z-axis (Size), used specifically for Bubble charts." },
      title: { type: Type.STRING, description: "A descriptive title for the chart." }
    },
    required: ["type", "xAxisKey", "title"]
  }
};

const cleanDataTool: FunctionDeclaration = {
  name: "cleanData",
  description: "Perform data cleaning operations like removing outliers or imputing missing values.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operation: { type: Type.STRING, enum: ["remove_outliers", "impute_mean", "drop_missing"], description: "The cleaning operation to perform." },
      column: { type: Type.STRING, description: "The column to apply the operation on." }
    },
    required: ["operation", "column"]
  }
};

const createDashboardItemTool: FunctionDeclaration = {
  name: "addToDashboard",
  description: "Add the current visualization configuration to the main dashboard.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        note: { type: Type.STRING, description: "A short note about why this was added."}
    }
  }
};

const tools: Tool[] = [{
  functionDeclarations: [generateVisualizationTool, cleanDataTool, createDashboardItemTool]
}];

export const getGeminiResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  dataContext: string,
  modelName: string = "gemini-2.5-flash"
) => {
  if (!apiKey) throw new Error("API Key not found");

  const systemInstruction = `
    You are an expert Data Analyst Agent named "InsightFlow".
    
    Your goal is to help the user understand their data through visualization, cleaning, and analysis.
    
    Current Data Context (Summary):
    ${dataContext}

    Guidelines:
    1. If the user asks for a visualization, ALWAYS use the 'generateVisualization' tool.
    2. If the user asks to clean data (remove outliers, fill missing), use the 'cleanData' tool.
    3. If the user likes a chart, suggest adding it to the dashboard using 'addToDashboard'.
    4. Be concise and professional.
    5. Chart selection guide:
       - Univariate (counts): Bar, Pie, Doughnut.
       - Correlation (2 vars): Scatter, Line.
       - Correlation (3 vars): Bubble (X, Y, Size).
       - Distribution: Box Plot (calculates median/quartiles automatically).
       - Overlap/Sets: Venn Diagram (requires 2 categorical columns).
       - Density: Heatmap or Contour.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: history.map(h => ({ role: h.role, parts: h.parts })),
      config: {
        tools: tools,
        systemInstruction: systemInstruction,
        temperature: 0.4,
      }
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};