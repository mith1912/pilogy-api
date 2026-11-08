import { assertNoQuery } from "@/lib/api/request";
import { failure, success } from "@/lib/api/response";
import { API_VERSION } from "@/lib/config";

export function GET(request: Request) {
  try {
    assertNoQuery(request);
    return success({ status: "ok", apiVersion: API_VERSION });
  } catch (error) { return failure(error); }
}
