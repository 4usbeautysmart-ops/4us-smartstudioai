import { LibraryItem } from '../types';

const STORAGE_KEY = '4us_smart_studio_library';

// New compression utility
export const compressImageForStorage = (base64Str: string, maxWidth = 1024, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!base64Str) return resolve(base64Str);
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = img.width / img.height;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                width = maxWidth;
                height = width / ratio;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (error) => {
            console.error("Image compression failed, falling back to original.", error);
            resolve(base64Str); 
        };
    });
};


export const saveToLibrary = async (item: Omit<LibraryItem, 'id' | 'date'>) => {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        const library: LibraryItem[] = existingData ? JSON.parse(existingData) : [];
        
        // Use an async version to handle compression
        const newItem: LibraryItem = {
            ...item,
            id: Date.now().toString(),
            date: new Date().toISOString(),
        };

        library.unshift(newItem);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        console.log("Successfully saved to library.");
        return newItem;
    } catch (error) {
        console.error("Failed to save to library", error);
        alert("Falha ao salvar na biblioteca. O armazenamento pode estar cheio.");
        return null;
    }
};

export const getLibraryItems = (): LibraryItem[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load library", error);
        return [];
    }
};

export const deleteLibraryItem = (id: string) => {
    try {
        const items = getLibraryItems();
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
    } catch (error) {
        console.error("Failed to delete item", error);
        return [];
    }
};

export const searchLibrary = (query: string, items: LibraryItem[]) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
        try {
            return item.clientName.toLowerCase().includes(lowerQuery) ||
                   new Date(item.date).toLocaleDateString('pt-BR').includes(query) ||
                   item.type.toLowerCase().includes(lowerQuery);
        } catch (e) {
            // Handles potential invalid date format in data
            return item.clientName.toLowerCase().includes(lowerQuery);
        }
    });
};