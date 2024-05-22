import { LightningElement, api } from 'lwc';

export default class AttachFileToWorkOrder extends LightningElement {

    @api
    recordId;

    showFiles = false;

    get showAddFilesButton(){
        return !this.showFiles;
    }

    showAddFile(){
        this.showFiles = true;
    }

    fileUploaded(){
        this.showFiles = false;
    }

    cancelUpload(){
        this.showFiles = false;
    }

}