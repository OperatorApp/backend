
const SECTION_CATALOG = [
    {
        id: "customer",
        data_path: "customer",
        entity_paths: ["customer.name", "customer.email"],
        keywords: {
            en: ["account", "email", "my name", "language", "login"],
            cs: ["účet", "email", "jméno", "jazyk", "přihlášení"],
        },
        decay: 0.85,
    },
    {
        id: "session",
        data_path: "session",
        entity_paths: ["country", "city"],
        keywords: {
            en: ["shipping to", "deliver to", "currency", "in my country", "from where"],
            cs: ["doprava", "doručení", "měna", "odkud"],
        },
        decay: 0.8,
    },
    {
        id: "url_trail",
        data_path: "url_trail",
        entity_paths: ["url_trail[*].url"],
        keywords: {
            en: ["the page", "earlier", "before", "that product", "this one", "browsing"],
            cs: ["stránka", "dříve", "předtím", "tento produkt"],
        },
        decay: 0.7,
    },
    {
        id: "cart",
        data_path: "cart_snapshot",
        entity_paths: ["cart_snapshot.items[*].name"],
        keywords: {
            en: ["cart", "checkout", "buy", "remove", "add", "coupon", "discount", "total"],
            cs: ["košík", "koupit", "odstranit", "přidat", "sleva", "celkem"],
        },
        decay: 0.8,
    },
    {
        id: "orders",
        data_path: "orders",
        entity_paths: ["orders[*].id", "orders[*].shipments[*].tracking_no"],
        keywords: {
            en: ["order", "shipment", "tracking", "delivered", "package", "carrier", "refund", "return"],
            cs: ["objednávka", "zásilka", "doručeno", "balíček", "vrácení"],
        },
        decay: 0.85,
    },
    {
        id: "sentiment",
        data_path: "sentiment_label",
        entity_paths: [],
        keywords: { en: [], cs: [] },
        decay: 0.9,
    },
]

const SCORING_CONFIG = {
    DEFAULT_DECAY: 0.8,
    PER_MESSAGE_BOOST_CAP: 0.6,
    KEYWORD_WEIGHT: 0.15,
    ENTITY_WEIGHT: 0.4,
    CUSTOMER_MESSAGE_WEIGHT: 1.0,
    OPERATOR_MESSAGE_WEIGHT: 0.4,
    SYSTEM_MESSAGE_WEIGHT: 0.0,
    SCORING_VERSION: 1,
}

module.exports = { SECTION_CATALOG, SCORING_CONFIG }