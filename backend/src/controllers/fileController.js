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

    // Save metadata
    const { data, error } = await supabase
      .from("file_metadata")
      .insert([{ filename: file.originalname, url, size: file.size, uploader }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
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


// Get all files metadata
export const listFiles = async (req, res) => {
  const { data, error } = await supabase.from("file_metadata").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
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
