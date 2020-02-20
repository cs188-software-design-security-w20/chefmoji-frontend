CHEFMOJI_SRC_DIR=user-login

install:
	npm install
	make build

build:
	npm run build

proto:
	./node_modules/protobufjs/bin/pbjs -t static-module -w commonjs -o ./src/proto/messages.js ./src/proto/game_update.proto ./src/proto/player_action.proto
	# sed -i '' -e '$ d' src/proto/messages.js
	# cat src/proto/pbjs_shim.js >> src/proto/messages.js

clean:
	rm ./src/proto/messages.js

dev:
	npm run dev
