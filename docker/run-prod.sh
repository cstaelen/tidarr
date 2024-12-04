# AUTH JWT RANDOM SECRET
export JWT_SECRET=`tr -dc A-Za-z0-9 </dev/urandom | head -c 15; echo`

bash /home/app/standalone/docker/env.sh
sleep 2
yarn --cwd ./api prod