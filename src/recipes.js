
const OrderTypeEnum = Object.freeze({
    // easy
	HOT_DOG: 1,
	PIZZA: 2,
	WAFFLES: 3,
	SUSHI: 4,
	EGGS: 5,

	// medium
	GYRO: 6,
	PANCAKES: 7,
	RAMEN: 8,
	STEW: 9,

	// hard
	BENTO_BOX: 10,
	TACO: 11,
	SANDWICH: 12,
	HAMBURGER: 13,
	BURRITO: 14,
	CURRY_RICE: 15
});

const EmojiFromOrderEnum = (type) => {
    switch (type) {
        case OrderTypeEnum.HOT_DOG:
            return '🌭';
        case OrderTypeEnum.PIZZA:
            return '🍕';
        case OrderTypeEnum.WAFFLES:
            return '🧇';
        case OrderTypeEnum.SUSHI:
            return '🍣';
        case OrderTypeEnum.EGGS:
            return '🍳';
        case OrderTypeEnum.GYRO:
            return '🥙';
        case OrderTypeEnum.PANCAKES:
            return '🥞';
        case OrderTypeEnum.RAMEN:
            return '🍜';
        case OrderTypeEnum.STEW:
            return '🍲';
        case OrderTypeEnum.BENTO_BOX:
            return '🍱';
        case OrderTypeEnum.TACO:
            return '🌮';
        case OrderTypeEnum.SANDWICH:
            return '🥪';
        case OrderTypeEnum.HAMBURGER:
            return '🍔';
        case OrderTypeEnum.BURRITO:
            return '🌯';
        case OrderTypeEnum.CURRY_RICE:
            return '🍛';
        default:
            return undefined;
    }
};

const ORDER_TTL = 120;


const recipes = {
    '🌭': {'name': 'HOT_DOG', 'emoji': '🌭', 'difficulty': 1, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🍖', 'chopped': false}], 'cooked': true},
    '🍕': {'name': 'PIZZA', 'emoji': '🍕', 'difficulty': 1, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🍅', 'chopped': true}], 'cooked': true},
    '🧇': {'name': 'WAFFLES', 'emoji': '🧇', 'difficulty': 1, 'ingredients': [{'emoji': '🥛', 'chopped': false}, {'emoji': '🥚', 'chopped': false}, {'emoji': '🌾', 'chopped': false}], 'cooked': true},
    '🍣': {'name': 'SUSHI', 'emoji': '🍣', 'difficulty': 1, 'ingredients': [{'emoji': '🐟', 'chopped': true}, {'emoji': '🍚', 'chopped': false}], 'cooked': false},
    '🍳': {'name': 'EGGS', 'emoji': '🍳', 'difficulty': 1, 'ingredients': [{'emoji': '🥚', 'chopped': false}, {'emoji': '🥚', 'chopped': false}, {'emoji': '🥚', 'chopped': false}], 'cooked': true},
    '🥙': {'name': 'GYRO', 'emoji': '🥙', 'difficulty': 2, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🍅', 'chopped': true}], 'cooked': false},
    '🥞': {'name': 'PANCAKES', 'emoji': '🥞', 'difficulty': 2, 'ingredients': [{'emoji': '🥛', 'chopped': false}, {'emoji': '🥚', 'chopped': false}, {'emoji': '🧈', 'chopped': false}, {'emoji': '🌾', 'chopped': false}], 'cooked': true},
    '🍜': {'name': 'RAMEN', 'emoji': '🍜', 'difficulty': 2, 'ingredients': [{'emoji': '🍵', 'chopped': false}, {'emoji': '🐖', 'chopped': true}, {'emoji': '🍝', 'chopped': false}, {'emoji': '🍥', 'chopped': false}], 'cooked': true}, 
    '🍲': {'name': 'STEW', 'emoji': '🍲', 'difficulty': 2, 'ingredients': [{'emoji': '🍵', 'chopped': false}, {'emoji': '🥔', 'chopped': true}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🥕', 'chopped': true}], 'cooked': true},
    '🍱': {'name': 'BENTO_BOX', 'emoji': '🍱', 'difficulty': 3, 'ingredients': [{'emoji': '🍚', 'chopped': false}, {'emoji': '🐟', 'chopped': true}, {'emoji': '🥔', 'chopped': true}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🍥', 'chopped': false}], 'cooked': false},
    '🌮': {'name': 'TACO', 'emoji': '🌮', 'difficulty': 3, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🥩', 'chopped': false}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🧅', 'chopped': true}], 'cooked': false},
    '🥪': {'name': 'SANDWICH', 'emoji': '🥪', 'difficulty': 3, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🐖', 'chopped': true}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🍅', 'chopped': true}], 'cooked': false},
    '🍔': {'name': 'HAMBURGER', 'emoji': '🍔', 'difficulty': 3, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🥩', 'chopped': false}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🍅', 'chopped': true}, {'emoji': '🧅', 'chopped': true}], 'cooked': true},
    '🌯': {'name': 'BURRITO', 'emoji': '🌯', 'difficulty': 3, 'ingredients': [{'emoji': '🍞', 'chopped': false}, {'emoji': '🧀', 'chopped': false}, {'emoji': '🥩', 'chopped': false}, {'emoji': '🥬', 'chopped': true}, {'emoji': '🧅', 'chopped': true}], 'cooked': true},
    '🍛': {'name': 'CURRY_RICE', 'emoji': '🍛', 'difficulty': 3, 'ingredients': [{'emoji': '🍚', 'chopped': false}, {'emoji': '🧅', 'chopped': true}, {'emoji': '🧄', 'chopped': true}, {'emoji': '🍵', 'chopped': false}, {'emoji': '🥕', 'chopped': true}], 'cooked': true}}
const recipes_old = {
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