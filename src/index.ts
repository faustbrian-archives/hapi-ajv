import { ResponseToolkit, Server } from "@hapi/hapi";
import AJV, { ErrorObject } from "ajv";

import { IValidationError } from "./interfaces";

function mapErrors(type: string, errors: ErrorObject[]): any[] {
	return errors.map((error) => {
		const report: IValidationError = {
			status: 422,
			source: { pointer: error.schemaPath },
			title: error.keyword,
		};

		if (error.message) {
			report.detail = error.message;
		}

		if (error.dataPath) {
			// @ts-ignore
			report.source.parameter = error.dataPath;
		}

		// @ts-ignore
		if (type === "query" && error.params.additionalProperty) {
			report.title = "Invalid Query Parameter";
			report.detail = `The endpoint does not have a '${
				// @ts-ignore
				error.params.additionalProperty
			}' query parameter.`;
		}

		return report;
	});
}

export const plugin = {
	pkg: require("../package.json"),
	once: true,
	register(server: Server, options = {}) {
		const ajv = new AJV(options);

		server.ext({
			type: "onPreHandler",
			method: (request: any, h: ResponseToolkit) => {
				// @ts-ignore
				const config = request.route.settings.plugins.ajv || {};

				for (const type of ["headers", "params", "query", "payload"]) {
					const schema = config[type];

					if (schema) {
						if (type !== "headers") {
							schema.additionalProperties = false;
						}

						if (!ajv.validate(schema, request[type])) {
							return h
								.response({
									errors: ajv.errors ? mapErrors(type, ajv.errors) : [],
								})
								.code(422)
								.takeover();
						}
					}
				}

				return h.continue;
			},
		});
	},
};
