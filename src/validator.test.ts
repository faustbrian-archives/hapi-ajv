import Hapi from "@hapi/hapi";

import { plugin } from "../src";

const schema: object = {
	properties: {
		name: { type: "string" },
	},
	required: ["name"],
};

async function sendRequest(
	url: string,
	method = "GET"
): Promise<Hapi.ServerInjectResponse> {
	const server = new Hapi.Server({ debug: { request: ["*"] } });
	await server.register({ plugin });

	server.route({
		method: "GET",
		path: "/",
		handler: () => [],
	});

	// @ts-ignore
	server.route({
		method: "GET",
		path: "/query",
		handler: () => [],
		options: {
			plugins: {
				ajv: {
					query: schema,
				},
			},
		},
	});

	// @ts-ignore
	server.route({
		method: "POST",
		path: "/payload",
		handler: () => [],
		options: {
			plugins: {
				ajv: {
					payload: schema,
				},
			},
		},
	});

	// @ts-ignore
	server.route({
		method: "GET",
		path: "/params",
		handler: () => [],
		options: {
			plugins: {
				ajv: {
					params: schema,
				},
			},
		},
	});

	// @ts-ignore
	server.route({
		method: "GET",
		path: "/headers",
		handler: () => [],
		options: {
			plugins: {
				ajv: {
					headers: schema,
				},
			},
		},
	});

	return server.inject({ method, url, payload: {} });
}

function expect422(response: any) {
	expect(response.statusCode).toBe(422);

	expect(JSON.parse(response.payload)).toEqual({
		errors: [
			{
				status: 422,
				source: {
					pointer: "#/required",
				},
				title: "required",
				detail: "must have required property 'name'",
			},
		],
	});
}

describe("Validator", () => {
	it("should return 200 if no validation is required", async () => {
		expect((await sendRequest("/")).statusCode).toBe(200);
	});

	it("should return 422 if query validation fails", async () => {
		expect422(await sendRequest("/query"));
	});

	it("should return 422 if payload validation fails", async () => {
		expect422(await sendRequest("/payload", "POST"));
	});

	it("should return 422 if params validation fails", async () => {
		expect422(await sendRequest("/params"));
	});

	it("should return 422 if headers validation fails", async () => {
		expect422(await sendRequest("/headers"));
	});
});
