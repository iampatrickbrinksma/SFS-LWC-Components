import { LightningElement, api, track, wire } from "lwc";

import { ShowToastEvent } from "lightning/platformShowToastEvent";

import {
    createContentDocumentAndVersion,
    createRecord,
    updateRecord
} from "lightning/uiRecordApi";

import { getObjectInfos } from "lightning/uiObjectInfoApi";

import CONTENT_DOCUMENT from "@salesforce/schema/ContentDocument";
import CONTENT_VERSION from "@salesforce/schema/ContentVersion";
import CONTENT_DOCUMENT_LINK from "@salesforce/schema/ContentDocumentLink";

export default class FileUploadPlus extends LightningElement {
    @api
    recordId;

    @api
    customField;

    @api
    customFieldLabel;

    @track
    files = undefined;

    @track
    fieldValues = {
        fileTitle: "",
        fileDesc: "",
        fileCustomField: "",
    };
    
    uploadingFile = false;

    errorMessage = "";

    // Force priming of the object infos for offline support
    @wire(getObjectInfos, {
        objectApiNames: [CONTENT_DOCUMENT, CONTENT_VERSION, CONTENT_DOCUMENT_LINK],
    })
    objectMetadata;

    // Getter used for local-only processing. Not needed for offline caching.
    // eslint-disable-next-line @salesforce/lwc-graph-analyzer/no-getter-contains-more-than-return-statement
    get fileName() {
        // eslint-disable-next-line @salesforce/lwc-graph-analyzer/no-unsupported-member-variable-in-member-expression
        const file = this.files && this.files[0];
        if (file) {
            return file.name;
        }
        return undefined;
    }

    // Input handler
    handleInputChange(event) {
        if (event.target.name === 'fileUploader'){
            this.files = event.detail.files; 
            this.fieldValues.fileTitle = this.fileName;   
        } else {
            this.fieldValues[event.target.name] = event.detail.value;
        }
    }

    // Restore UI to default state
    resetInputs() {
        this.files = [];
        this.fieldValues = {
            fileTitle: "",
            fileDesc: "",
            fileTemplateKey: "",
        };
        this.errorMessage = "";
    }

    async handleUploadFile() {
        if (this.uploadingFile) {
            return;
        }

        const file = this.files && this.files[0];
        if (!file) {
            return;
        }

        try {
            this.uploadingFile = true;

            const contentDocumentAndVersion =
                await createContentDocumentAndVersion({
                    title: this.fieldValues.fileTitle,
                    description: this.fieldValues.fileDesc,
                    fileData: file,
                });

            if(this.fieldValues.customField && this.fieldValues.customField !== ""){
                const contentVersionId = contentDocumentAndVersion.contentVersion.fields.Id.value;
                this.updateContentVersion(contentVersionId);
            }

            if (this.recordId) {
                const contentDocumentId = contentDocumentAndVersion.contentDocument.id;
                await this.createContentDocumentLink(this.recordId, contentDocumentId);
            }

            this.notifySuccess();
            this.resetInputs();
        } catch (error) {
            this.errorMessage = error;
        } finally {
            this.uploadingFile = false;
        }
    }

    async updateContentVersion(contentVersionId){
        const fields = {
            "Id" : contentVersionId,
        };
        fields[this.customField] = this.fieldValues.customField;
        const result = await updateRecord({ fields });
    }

    async createContentDocumentLink(recordId, contentDocumentId) {
        await createRecord({
            apiName: "ContentDocumentLink",
            fields: {
                LinkedEntityId: recordId,
                ContentDocumentId: contentDocumentId,
                ShareType: "V",
            },
        });
    }

    cancelUpload() {
        this.dispatchEvent(
            new CustomEvent("cancelupload")
        );

    }

    notifySuccess() {
        this.dispatchEvent(
            new CustomEvent("fileuploaded")
        );
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Upload Successful",
                message: "File enqueued for upload.",
                variant: "success",
            })
        );
    }
}