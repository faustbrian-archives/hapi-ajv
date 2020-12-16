export interface IValidationError {
	status: number;
	source: {
		pointer: string;
		parameter?: string;
	};
	title: string;
	detail?: string;
}
