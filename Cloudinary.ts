export default async function uploadToCloudinary(imageUri: string): Promise<string | null> {
    // PS: You can get the preset and cloudName after creating an account and a preset at Cloudinary website.
    const cloudName = "@your_cloud_name";  
    const uploadPreset = "@your_preset_name";
    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const data = new FormData();
    data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
    } as any);

    data.append("upload_preset", uploadPreset);
    data.append("cloud_name", cloudName);

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            body: data,
        });

        const result = await response.json();
        console.log("Upload réussi ! URL :", result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error("Erreur d'upload :", error);
        return null;
    }
}
