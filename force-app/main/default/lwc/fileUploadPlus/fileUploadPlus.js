import { LightningElement, api, track, wire } from "lwc";
// Toast Message
import { ShowToastEvent } from "lightning/platformShowToastEvent";
// Create File, Create Record and Update Record
import {
    createContentDocumentAndVersion,
    createRecord,
    updateRecord
} from "lightning/uiRecordApi";
// Get metadata of several objects
import { getObjectInfos } from "lightning/uiObjectInfoApi";
// Objects related to Files
import CONTENT_DOCUMENT from "@salesforce/schema/ContentDocument";
import CONTENT_VERSION from "@salesforce/schema/ContentVersion";
import CONTENT_DOCUMENT_LINK from "@salesforce/schema/ContentDocumentLink";

export default class FileUploadPlus extends LightningElement {
    // Record to which the uploaded file is associated
    @api
    recordId;
    // API Name of the custom field on ContentVersion to be populated
    @api
    customField;
    // Label of the custom field on ContentVersion to be populated
    @api
    customFieldLabel;
    // Files selected for upload (this component supports a single file)
    @track
    files = undefined;
    // Input field values
    @track
    fieldValues = {
        fileTitle: "",
        fileDesc: "",
        fileCustomField: "",
    };
    // Indicator if the file upload is ongoing
    uploadingFile = false;
    // Error message for display
    errorMessage = "";

    // Force priming of the object infos for offline support
    @wire(getObjectInfos, {
        objectApiNames: [CONTENT_DOCUMENT, CONTENT_VERSION, CONTENT_DOCUMENT_LINK],
    })
    objectMetadata;

    // File name of the select file
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

    // Field change handler
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

    // Upload the file
    async handleUploadFile() {
        // Validate if file upload is in progress
        if (this.uploadingFile) {
            return;
        }
        // Validate if a file is selected
        const file = this.files && this.files[0];
        if (!file) {
            return;
        }
        // Upload
        try {
            this.uploadingFile = true;
            // First create the ContentDocument and ContentVersion records
            const contentDocumentAndVersion =
                await createContentDocumentAndVersion({
                    title: this.fieldValues.fileTitle,
                    description: this.fieldValues.fileDesc,
                    fileData: file,
                });
            // If a custom field was passed, and it has a value, update ContentVersion record
            if(this.fieldValues.customField && this.fieldValues.customField !== ""){
                const contentVersionId = contentDocumentAndVersion.contentVersion.fields.Id.value;
                this.updateContentVersion(contentVersionId);
            }
            // If recordId was passed, create ContentDocumentLink
            if (this.recordId) {
                const contentDocumentId = contentDocumentAndVersion.contentDocument.id;
                await this.createContentDocumentLink(this.recordId, contentDocumentId);
            }
            // Success toast message (and custom event)
            this.notifySuccess();
            // Reset input
            this.resetInputs();
        } catch (error) {
            this.errorMessage = error;
        } finally {
            this.uploadingFile = false;
        }
    }

    // Update ContentVersion record with custom field
    async updateContentVersion(contentVersionId){
        const fields = {
            "Id" : contentVersionId,
        };
        fields[this.customField] = this.fieldValues.customField;
        await updateRecord({ fields });
    }

    // Create ContentDocumentLink record to associate file to provided record
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

    // Dispatch custom event to any parent
    // and display toast message
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