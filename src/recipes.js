
const OrderTypeEnum = Object.freeze({HOT_DOG: 0, PIZZA: 1, WAFFLES: 2, HAMBURGER: 3});

const EmojiFromOrderEnum = (type) => {
    switch (type) {
        case OrderTypeEnum.HOT_DOG:
            return '🌭';
        case OrderTypeEnum.PIZZA:
            return '🍕';
        case OrderTypeEnum.WAFFLES:
            return '🧇';
        case OrderTypeEnum.HAMBURGER:
            return '🍔';
        default:
            return undefined;
    }
};

const ORDER_TTL = 20;

const recipes = {
    '🌭' : {
        name : 'Hot Dog',
        emoji : '🌭',
        difficulty : 1,
        ingredients: [
            {
                emoji: '🍞',
                chopped: false
            },
            {
                emoji: '🥩',
                chopped: false
            }
        ],
        cooked: true
    },
    '🍕' : {
        name : 'Pizza',
        emoji : '🍕',
        difficulty : 1,
        ingredients: [
            {
                emoji: '🍞',
                chopped: false
            },
            {
                emoji: '🧀',
                chopped: false
            },
            {
                emoji: '🍅',
                chopped: false
            }
        ],
        cooked: true
    },
    '🧇' : {
        name : 'Waffles',
        emoji : '🧇',
        difficulty : 1,
        ingredients: [
            {
                emoji: '🥛',
                chopped: false
            },
            {
                emoji: '🥚',
                chopped: false
            },
            {
                emoji: '🌾',
                chopped: false
            }
        ],
        cooked: true
    },
    '🍔' : {
        name : 'Hamburger',
        emoji : '🍔',
        difficulty : 3,
        ingredients: [
            {
                emoji: '🍞',
                chopped: false
            },
            {
                emoji: '🧀',
                chopped: false
            },
            {
                emoji: '🥩',
                chopped: false
            },
            {
                emoji: '🥬',
                chopped: true
            },
            {
                emoji: '🍅',
                chopped: true
            },
            {
                emoji: '🧅',
                chopped: true
            }

        ],
        cooked: true
    }
}

export {recipes, OrderTypeEnum, EmojiFromOrderEnum, ORDER_TTL};