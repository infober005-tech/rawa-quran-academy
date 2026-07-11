import base from "./fr/_base";
import dashboards from "./fr/dashboards";
import admin from "./fr/admin";
import subscription from "./fr/subscription";
import features from "./fr/features";
import pages from "./fr/pages";
const dict: Record<string, string> = { ...base, ...dashboards, ...admin, ...subscription, ...features, ...pages };
export default dict;