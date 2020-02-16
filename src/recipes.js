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

export {recipes};