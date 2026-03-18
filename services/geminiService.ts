import { GoogleGenAI } from "@google/genai";
import { DesignStyle, GenerationSettings, TypographyStyle } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

/**
 * Clean base64 string to remove data URI prefix if present.
 */
const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:(image\/\w+|application\/pdf);base64,/, '');
};

/**
 * Extract Mime Type from base64 string
 */
const getMimeType = (base64: string): string => {
    const match = base64.match(/^data:(.*);base64,/);
    if (match && match[1]) {
        return match[1];
    }
    // Default fallback
    return 'image/jpeg';
};

// Mapping Vietnamese Typography categories to detailed English Design Prompts
const TYPO_PROMPT_MAP: Record<TypographyStyle, string> = {
  'Tự động': "Analyze the visual context and choose the most suitable font style automatically.",
  'Làm đẹp, thời trang, mềm mại': "TYPOGRAPHY STYLE: Elegant, Sophisticated, and Soft. Use high-contrast Serif fonts (like Didot, Bodoni) or thin, graceful Sans-Serif. The text should feel luxurious, feminine, and editorial fashion magazine style.",
  'Cách điệu, dễ thương': "TYPOGRAPHY STYLE: Stylized, Cute, and Playful. Use Handwritten, Script, or Rounded Sans-Serif fonts. Incorporate organic curves, decorative swashes, or doodle-like elements. The vibe should be friendly and approachable.",
  'Tươi trẻ, màu sắc': "TYPOGRAPHY STYLE: Youthful, Vibrant, and Colorful. Use Bold Bubble fonts, 3D text effects, or Pop-art inspired type. The text should be dynamic, high-energy, potentially using gradients or multiple bright colors.",
  'Chuyên nghiệp, hiện đại': "TYPOGRAPHY STYLE: Professional, Corporate, and Clean. Use Geometric Sans-Serif fonts (like Helvetica, Futura, Roboto). Keep lines straight, balanced, and minimalist. Trustworthy and clear.",
  'Hoài cổ (Retro/Vintage)': "TYPOGRAPHY STYLE: Retro, Vintage, and Nostalgic. Use Cooper Black, slab serifs, or textured fonts reminiscent of the 70s, 80s, or 90s. Can include distressed edges, noise texture, or neon sign aesthetics.",
  'Mạnh mẽ, nổi bật': "TYPOGRAPHY STYLE: Bold, Impactful, and Loud. Use Heavy/Black weight Sans-Serif fonts, All-Caps. High contrast against the background. Poster-style typography designed to grab immediate attention."
};

/**
 * Mode 1: Clone Style + Insert Product
 */
export const generateBanner = async (
  referenceImages: string[],
  productImages: string[],
  brandDescription: string,
  promoInfo: string,
  userPrompt: string,
  style: DesignStyle,
  settings: GenerationSettings,
  apiKey?: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

    const typoInstruction = TYPO_PROMPT_MAP[settings.typography] || TYPO_PROMPT_MAP['Tự động'];

    const promptText = `
      ROLE: expert AI Graphic Designer and Copywriter.
      TASK: Create a high-converting, visually stunning advertising banner.

      INPUTS:
      1. Reference Images (First ${referenceImages.length} images): These define the visual style, layout composition, color grading, and general vibe.
      2. Product Assets (Subsequent images): These are the hero objects to feature.

      CORE DIRECTIVES:
      1. STYLE ADAPTATION (Visuals):
         - Analyze the "vibe" of the reference images.
         - Create a COMPLETELY NEW composition. Do not just copy pixels, steal the "look and feel".
         - Ensure Product Assets are naturally integrated (match lighting, shadows, reflection, perspective).

      2. INTELLIGENT COPYWRITING & TYPOGRAPHY:
         - **Typography Directive:** ${typoInstruction}
         - **Text Strategy:** ${promoInfo || brandDescription ? 'ADAPTIVE' : 'GENERATIVE'}.
         - IF user provided info ("${promoInfo}", "${brandDescription}"):
            - Select only the most impactful keywords. Do not clutter.
            - Render the text using the Typography Style defined above.
         - IF NO user info is provided:
            - Create a catchy, short tagline based on the product.
            - Example: "Cool for the Summer" for a drink.
         - **Legibility:** Text must be artistic but readable. Follow visual hierarchy (Headline > Subtext).

      3. COMPOSITION RULES:
         - Prioritize visual aesthetics. Negative space is key.
         - Design Style: Apply a "${style}" approach.
         ${userPrompt ? `- User's Custom Wishlist: ${userPrompt}` : ''}

      OUTPUT:
      - A single, high-quality image containing the product and rendered text.
    `;

    const parts: any[] = [{ text: promptText }];
    
    // Add all reference images
    referenceImages.forEach(ref => {
      parts.push({
        inlineData: {
          mimeType: getMimeType(ref),
          data: cleanBase64(ref),
        },
      });
    });

    // Add all product images
    productImages.forEach(prod => {
      parts.push({
        inlineData: {
          mimeType: getMimeType(prod),
          data: cleanBase64(prod),
        },
      });
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
            aspectRatio: settings.aspectRatio,
            imageSize: settings.quality
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 'PERMISSION_DENIED' || error.code === 403) {
        throw new Error("Permission Denied: Please select a paid API Key with access to Gemini 3 Pro models.");
    }
    throw error;
  }
};

/**
 * Mode 2: Design from Info File
 */
export const generateDesign = async (
    referenceImages: string[],
    infoFiles: string[],
    brandDescription: string,
    promoInfo: string,
    userPrompt: string,
    style: DesignStyle,
    settings: GenerationSettings,
    apiKey?: string
  ): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
      const typoInstruction = TYPO_PROMPT_MAP[settings.typography] || TYPO_PROMPT_MAP['Tự động'];
  
      const promptText = `
        ROLE: Expert AI Graphic Designer.
        TASK: Design a professional advertising banner by extracting content from an Information File and applying a specific Visual Style.
  
        INPUTS:
        1. Reference Images (First ${referenceImages.length} items): DEFINES THE VISUAL STYLE (Color palette, layout mood, font style, vibe).
        2. Information Source (Subsequent items): Contains the RAW CONTENT (Program details, dates, prices, logos, or main subject).
  
        CORE DIRECTIVES:
        1. CONTENT EXTRACTION (From Information Source):
           - READ the attached Information File (Image or PDF) thoroughly.
           - Extract key details: Event Names, Dates, Prices, Headlines, Call to Actions, and Main Subject Imagery (if present in the info file).
           - Combine with User Inputs: "${brandDescription}" and "${promoInfo}".
           - Prioritize the most important information for a banner hierarchy.
  
        2. VISUAL EXECUTION (Based on Reference Images):
           - IGNORE the *content* of the reference images, but STEAL their *style*.
           - Apply the reference's color grading, lighting, and composition to the extracted content.
           - Create a high-end, polished look.
           - Design Style: "${style}".
  
        3. TYPOGRAPHY & LAYOUT:
           - **Typography Directive:** ${typoInstruction}
           - Ensure text is legible.
           - Create a balanced composition.
           ${userPrompt ? `- User's Custom Wishlist: ${userPrompt}` : ''}
  
        OUTPUT:
        - A single, high-quality banner image that presents the extracted information in the requested style.
      `;
  
      const parts: any[] = [{ text: promptText }];
      
      // Add reference images
      referenceImages.forEach(ref => {
        parts.push({
          inlineData: {
            mimeType: getMimeType(ref),
            data: cleanBase64(ref),
          },
        });
      });
  
      // Add info files (PDF or Images)
      infoFiles.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: getMimeType(file),
            data: cleanBase64(file),
          },
        });
      });
  
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
              aspectRatio: settings.aspectRatio,
              imageSize: settings.quality
          }
        }
      });
  
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
  
      throw new Error("No image data found in response");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.status === 'PERMISSION_DENIED' || error.code === 403) {
          throw new Error("Permission Denied: Please select a paid API Key with access to Gemini 3 Pro models.");
      }
      throw error;
    }
  };

/**
 * Edit an existing banner based on a new prompt.
 */
export const editBanner = async (
    currentImageBase64: string,
    editPrompt: string,
    aspectRatio: string,
    apiKey?: string
  ): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });
  
      const promptText = `
        TASK: Edit the provided image based on the user's instruction.
        USER INSTRUCTION: "${editPrompt}"
        
        DIRECTIVES:
        - Maintain the overall high quality and resolution.
        - Only modify the elements requested by the user.
        - Ensure typography remains legible if touched.
        - Return the full image.
      `;
  
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64(currentImageBase64),
              },
            },
          ],
        },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any, 
                imageSize: '1K' 
            }
        }
      });
  
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
  
      throw new Error("No image data found in response");
    } catch (error: any) {
      console.error("Gemini Edit API Error:", error);
      if (error.status === 'PERMISSION_DENIED' || error.code === 403) {
          throw new Error("Permission Denied: Please select a paid API Key with access to Gemini 3 Pro models.");
      }
      throw error;
    }
  };