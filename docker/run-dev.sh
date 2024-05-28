bash /home/app/build/docker/env.sh
sleep 2
yarn install
yarn --cwd ./app install
yarn --cwd ./api install
yarn --cwd ./e2e install
yarn dev