import { FileType } from 'src/common/enum/file_type.enum';

export default class DetermineFileType {
    public readonly determineFileType = (mimeType: string): FileType => {
        if (mimeType.includes('audio')) return FileType.AUDIO;
        if (mimeType.includes('video')) return FileType.VIDEO;
        if (mimeType.includes('image')) return FileType.IMAGE;
        if (mimeType.includes('pdf')) return FileType.PDF;
        if (mimeType.includes('document')) return FileType.DOCUMENT;
        return FileType.OTHER;
    };
}
