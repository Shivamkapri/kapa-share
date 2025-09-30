// Delete file (admin password required)
export const deleteFile = async (req, res) => {
  const { filename } = req.params;
  const { adminPassword } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password" });
  }
  // Delete from Supabase storage
  const { error: storageError } = await supabase.storage.from("uploads").remove([filename]);
  if (storageError) return res.status(500).json({ error: storageError.message });
  // Delete metadata
  const { error: dbError } = await supabase.from("file_metadata").delete().eq("filename", filename);
  if (dbError) return res.status(500).json({ error: dbError.message });
  res.json({ message: "File deleted" });
};

import supabase from "../services/supabase.js";


// Share text as a file-like entry
export const shareText = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // Create a filename from the title
    const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_text.txt`;
    
    // Create text file buffer
    const textContent = `Title: ${title}\n${author ? `Author: ${author}\n` : ''}\n${content}`;
    const textBuffer = Buffer.from(textContent, 'utf8');

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, textBuffer, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(filename);
    const url = publicUrlData.publicUrl;

    // Save metadata with text-specific fields
    try {
      const { data, error } = await supabase
        .from("file_metadata")
        .insert([{ 
          filename, 
          url, 
          size: textBuffer.length, 
          uploader: author, 
          starred: false,
          text_title: title,
          text_content: content,
          is_text: true 
        }]);
      if (error) throw error;
      res.json({ data });
    } catch (err) {
      // Fallback: try without text-specific fields if columns don't exist
      console.warn('Trying insert without text-specific fields:', err.message);
      const { data, error: fallbackError } = await supabase
        .from("file_metadata")
        .insert([{ 
          filename, 
          url, 
          size: textBuffer.length, 
          uploader: author
        }]);
      if (fallbackError) return res.status(500).json({ error: fallbackError.message });
      res.json({ data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload file to Supabase storage and save metadata
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const uploader = req.body.uploader || null;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(file.originalname, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(file.originalname);
    const url = publicUrlData.publicUrl;

    // Save metadata (try with starred field, fallback without it)
    try {
      const { data, error } = await supabase
        .from("file_metadata")
        .insert([{ filename: file.originalname, url, size: file.size, uploader, starred: false }]);
      if (error) throw error;
      res.json({ data });
    } catch (err) {
      // Fallback: try without starred field if column doesn't exist
      console.warn('Trying insert without starred field:', err.message);
      const { data, error: fallbackError } = await supabase
        .from("file_metadata")
        .insert([{ filename: file.originalname, url, size: file.size, uploader }]);
      if (fallbackError) return res.status(500).json({ error: fallbackError.message });
      res.json({ data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save file metadata (legacy/manual)
export const saveFileMetadata = async (req, res) => {
  const { filename, url, size, uploader } = req.body;
  const { data, error } = await supabase
    .from("file_metadata")
    .insert([{ filename, url, size, uploader }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};


// Get all files metadata with proper ordering
export const listFiles = async (req, res) => {
  try {
    // First, try the ideal query with both starred and uploaded_at ordering
    let { data, error } = await supabase
      .from("file_metadata")
      .select("*")
      .order("starred", { ascending: false, nullsFirst: false })
      .order("uploaded_at", { ascending: false }); // Use uploaded_at instead of created_at
      
    // If uploaded_at doesn't exist, try without it
    if (error && error.message.includes("uploaded_at")) {
      console.warn('uploaded_at column not found, trying without it');
      const result = await supabase
        .from("file_metadata")
        .select("*")
        .order("starred", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false }); // Use id as fallback for ordering
      data = result.data;
      error = result.error;
    }
    
    // If starred column doesn't exist either, get basic data
    if (error && error.message.includes("starred")) {
      console.warn('starred column not found, getting basic data');
      const result = await supabase
        .from("file_metadata")
        .select("*")
        .order("id", { ascending: false }); // Just order by id (newest first)
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('List files error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Ensure starred field exists for all files (fallback for missing column)
    const filesWithStarred = (data || []).map(file => ({
      ...file,
      starred: file.starred || false
    }));
    
    res.json({ data: filesWithStarred });
  } catch (err) {
    console.error('List files exception:', err);
    res.status(500).json({ error: err.message });
  }
};

// Toggle star status for a file
export const toggleStar = async (req, res) => {
  const { filename } = req.params;
  const { starred } = req.body;
  
  try {
    const { data, error } = await supabase
      .from("file_metadata")
      .update({ starred: starred })
      .eq("filename", filename);
      
    if (error) {
      console.error('Star toggle error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ data, message: "Star status updated" });
  } catch (err) {
    console.error('Star toggle exception:', err);
    res.status(500).json({ error: err.message });
  }
};

// Download/view file by filename
export const downloadFile = async (req, res) => {
  const { filename } = req.params;
  const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(filename);
  if (!publicUrlData || !publicUrlData.publicUrl) {
    return res.status(404).json({ error: "File not found" });
  }
  res.json({ url: publicUrlData.publicUrl });
};
