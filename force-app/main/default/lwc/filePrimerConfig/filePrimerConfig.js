export const FILEPRIMER_CONFIG = {
    filterFiles: true,          // Indicates if files should be filtered
    fileExtensions: [           // Which file extensions will be primed
            'pdf',
            'txt',
            'mp4',
            'jpg',
            'jpeg'
        ],
    maxFileSize: 5000000        // Maximum file size that will be primed
};

export const FILE_TYPE_ICONS = {
    'PNG': 'doctype:image',
    'JPG': 'doctype:image',
    'JPEG': 'doctype:image',
    'GIF': 'doctype:image',
    'PDF': 'doctype:pdf',
    'DOC': 'doctype:word',
    'DOCX': 'doctype:word',
    'RTF': 'doctype:rtf',
    'TXT': 'doctype:txt',
    'LOG': 'doctype:txt',
    'VSD': 'doctype:visio',
    'VSDX': 'doctype:visio',
    'CSV': 'doctype:csv',
    'XML': 'doctype:xml',
    'XLS': 'doctype:excel',
    'XLSX': 'doctype:excel',
    'ZIP': 'doctype:zip',
    'MP3': 'doctype:audio',
    'WAV': 'doctype:audio',
    'MP4': 'doctype:video',
    'MOV': 'doctype:video',
    'WMV': 'doctype:video',
    'PPT': 'doctype:ppt',
    'PPTX': 'doctype:ppt',
    'UNKNOWN': 'doctype:unknown',
};
