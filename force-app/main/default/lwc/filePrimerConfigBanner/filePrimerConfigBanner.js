import { LightningElement } from 'lwc';

import { FILEPRIMER_CONFIG } from 'c/filePrimerConfig';

export default class FilePrimerConfigBanner extends LightningElement {

    _filePrimerConfig = FILEPRIMER_CONFIG;

    // Which file extensions are primed?
    get allowedFileExts() {
        return this._filePrimerConfig.filterFiles && Array.isArray( this._filePrimerConfig.fileExtensions ) 
            && this._filePrimerConfig.fileExtensions.length > 0 
                ? this._filePrimerConfig.fileExtensions.join( ", ") 
                : "all file extensions";
    }

    // What is the maximum file size primed?
    get maxFileSize() {
        return this._filePrimerConfig.filterFiles && this._filePrimerConfig.maxFileSize !== undefined 
            ? `${ ( this._filePrimerConfig.maxFileSize / 1000 ).toFixed(0) }KB` 
            : "all file sizes";
    }        

}