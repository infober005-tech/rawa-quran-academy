import base from "./en/_base";
import dashboards from "./en/dashboards";
import admin from "./en/admin";
import subscription from "./en/subscription";
import features from "./en/features";
import pages from "./en/pages";
const dict: Record<string, string> = { ...base, ...dashboards, ...admin, ...subscription, ...features, ...pages };
export default dict;