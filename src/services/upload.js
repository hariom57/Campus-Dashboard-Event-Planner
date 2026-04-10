const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY; 

export const uploadImageToCDN = async (file) => {
    if (!file) throw new Error("No file provided");
    
    if (!IMGBB_API_KEY) {
        console.error("ImgBB API Key is missing! Check your .env file.");
        throw new Error("ImgBB API Key missing");
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
            return data.data.url; // Returns the hosted image URL
        } else {
            throw new Error(data.error?.message || "Upload response failed");
        }
    } catch (error) {
        console.error("Error uploading image to CDN:", error);
        throw error;
    }
};

export default {
    uploadImageToCDN
};