export interface IStorageService {
    uploadFile(file: Express.Multer.File, objectName: string): Promise<string>;
    deleteFile(objectName: string): Promise<void>;
    deleteMultipleFiles(objectName: string[]): Promise<void>;
    updateFile(file: Express.Multer.File, objectName: string): Promise<string>;
    presignedGetObject(objectName: string): Promise<string>;
    listAllObjects(): Promise<string[]>;
}
