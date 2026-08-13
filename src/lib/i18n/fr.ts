import base from "./fr/_base";
import dashboards from "./fr/dashboards";
import admin from "./fr/admin";
import subscription from "./fr/subscription";
import features from "./fr/features";
import pages from "./fr/pages";
import widgets from "./fr/widgets";
const dict: Record<string, string> = { ...base, ...dashboards, ...admin, ...subscription, ...features, ...pages, ...widgets };
export default dict;