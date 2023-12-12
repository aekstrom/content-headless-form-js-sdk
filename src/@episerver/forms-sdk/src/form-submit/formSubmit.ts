import { FormStorage } from "../form-storage";
import { FormValidator } from "../form-validator";
import { equals } from "../helpers";
import { FormConstants, FormContainer, FormSubmission, FormValidationResult } from "../models";
import { ApiConstant } from "../form-loader/apiConstant";

export interface FormSubmitModel {
    /**
     * The key of the form's submitted data.
     */
    formKey: string;
    /**
     * The locale of the submitted form.
     */
    locale: string;
    /**
     * Key value collection of submitted data
     */
    submissionData: FormSubmission[];
    /**
     * Indicate whether the form submission is finalize
     */
    isFinalized: boolean;
    /**
     * The key reference to newly saved form submission.
     */
    partialSubmissionKey: string;
    /**
     * The url of the page hosted the form step
     */
    hostedPageUrl: string;
    /**
     * The access token to identify login user
     */
    accessToken?: string;
}

export interface FormSubmitResult {
    /**
     * Indication if the submission succeeded.
     */
    success: boolean;
    /**
     * The key reference to newly saved form submission.
     */
    submissionKey: string;
    /**
     * Indication if the form validation succeeded.
     */
    validationFail: boolean;
    /**
     * List of error messages from the form submission.
     */
    errors: FormSubmitError[];
}

export interface FormSubmitError {
    /**
     * The section where the message originated from.
     */
    section: string;
    /**
     *  The message describing an outcome.
     */
    message: string;
    /**
     * The identifier of the resource that was the reason for this message to be created.
     */
    identifier: string;
}

/**
 * Class to submit form submission to Headless Form API
 */
export class FormSubmitter {
    readonly _form: FormContainer
    readonly _baseUrl: string

    constructor(form: FormContainer, baseUrl: string){
        this._form = form;
        this._baseUrl = baseUrl;
    }

    /**
     * Post an array of form submission to the Headless Form API
     * @param formSubmission the array of form submission to post
     */
    doSubmit(model: FormSubmitModel): Promise<FormSubmitResult> {
        return new Promise<FormSubmitResult>((resolve, reject)=>{
            let formStorage = new FormStorage(this._form);

            //save data to storage of browser
            formStorage.saveFormDataToStorage(model.submissionData);
    
            //post data to API
            let formData = new FormData();
            formData.append("formKey", model.formKey);
            formData.append("locale", model.locale);
            formData.append("IsFinalized", model.isFinalized.toString());
            formData.append("PartialSubmissionKey", model.partialSubmissionKey);
            formData.append("HostedPageUrl", model.hostedPageUrl);

            //append form submission to FormData object
            model.submissionData.forEach(data => {
                let ovalue = data.value;
                let key = `${FormConstants.FormFieldPrefix}${data.elementKey}`;
                // checking file upload elements, item must be File if any,
                // for using Object.getPrototypeOf(variable) variable must be object type
                if(Object.getPrototypeOf(ovalue) === FileList.prototype && (ovalue as FileList).length > 0) {
                        let files = ovalue as FileList,
                            fileNames = "";
                    // append each upload file with a unique key (bases on element's key) so that the server side can see it through the Request.Files,
                    // concat all the files' name and assign with the element's Id
                    for (var idx = 0; idx < files.length; idx++) {
                        let ofile = ovalue[idx];
                        if (ofile && Object.getPrototypeOf(ofile) === File.prototype) {
                            ofile = files[idx] as File;
                            formData.append(key + "_file_" + idx, ofile);
                        }

                        //always send file name to server if existed to handle case upload file then click back
                        fileNames += files[idx].name + "|"; // charactor | cannot be used in filename and then is safe for splitting later
                    }
                    formData.append(key, fileNames);
                }
                else {
                    formData.append(key, data.value);
                }
            });

            //init a request and call ajax
            let requestInit: RequestInit = {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${model.accessToken}`
                },
                body: formData
            }

            fetch(`${this._baseUrl}${ApiConstant.apiEndpoint}`, requestInit)
                .then(async (response: Response) => {
                    if(response.ok){
                        let json = await response.json();
                        resolve(json as FormSubmitResult);
                    }
                    else {
                        reject(response);
                    }
                })
                .catch((error: any) => {
                    reject(error);
                });
        });
    }

    /**
     * Function to validate data before submit
     * @param formSubmission the array of form submission to post
     * @returns An array of validation result
     */
    doValidate(formSubmissions: FormSubmission[]): FormValidationResult[]{
        return this._form.formElements
            .filter(e => formSubmissions.some(fs => equals(fs.elementKey, e.key)))
            .map(e => {
                let formValidator = new FormValidator(e);
                let value = formSubmissions.filter(fs => equals(fs.elementKey, e.key))[0]?.value;
                return {
                    elementKey: e.key,
                    results: formValidator.validate(value)
                } as FormValidationResult;
        });
    }
}