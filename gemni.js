import { GoogleGenerativeAI } from "@google/generative-ai"; // Ensure this line is uncommented in your environment

// Initialize the API with your API key from environment variables
const genAI = new GoogleGenerativeAI("AIzaSyDwzzocEIngGOBWm68OuNdEnEOtNwjq3Xc");

// Get the generative model with specific configuration
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    candidateCount: 1,              // Number of candidate responses
    stopSequences: ["x"],           // Define stop sequences
    maxOutputTokens: 50,            // Maximum output tokens
    temperature: 0.7,               // Adjust the randomness of the output
  },
});

 async function generateText(questions) {
  try {
    // Use a neutral prompt to avoid triggering safety filters
    const result = await model.generateContent(
        questions
    );
    console.log(result.response.text()); 
    return result.response.text();  // Log the generated text
  } catch (error) {
    // Enhanced error handling
    console.error("Error generating text:", error.message);
    console.error("Full error details:", error);
  }
}



export default generateText;