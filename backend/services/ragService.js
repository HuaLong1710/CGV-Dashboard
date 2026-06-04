const { pipeline } = require("@xenova/transformers");
const supabase = require("../config/supabase");

let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log("Loading embedding model...");

    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    console.log("Embedding model loaded!");
  }

  return embeddingPipeline;
}

async function createEmbedding(text) {
  const extractor = await getEmbeddingPipeline();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}

/*API Chat*/
async function searchRAG(userMessage) {
  try {
    const queryEmbedding = await createEmbedding(userMessage);

    const { data, error } = await supabase.rpc("match_rag_documents", {
      query_embedding: queryEmbedding,
      match_count: 3,
    });

    if (error) {
      console.log("RAG VECTOR ERROR:", error);
      return "";
    }

    if (!data || data.length === 0) {
      return "";
    }

    return data
      .map(
        (doc) =>
          `Tiêu đề: ${doc.title}\nNội dung: ${doc.content}\nĐộ liên quan: ${doc.similarity}`
      )
      .join("\n\n");
  } catch (error) {
    console.log("searchRAG error:", error);
    return "";
  }
}

async function embedNewDocuments() {
  const { data: docs, error } = await supabase
    .from("rag_documents")
    .select("id, content")
    .is("embedding", null);

  if (error) throw error;

  for (const doc of docs) {
    const embedding = await createEmbedding(doc.content);

    const { error: updateError } = await supabase
      .from("rag_documents")
      .update({
        embedding: embedding,
      })
      .eq("id", doc.id);

    if (updateError) throw updateError;
  }

  return docs.length;
}

module.exports = {
  createEmbedding,
  searchRAG,
  embedNewDocuments,
};