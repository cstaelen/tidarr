#!/usr/bin/env sh
#
# ENV VARS ON RUNTIME
# Load docker env vars on run time with .env file as fallback

ENV_JS=./public/env-config.js

echo "===> Overriding env params with args ... ${ENV_JS}"
echo "window._env_ = {" > ${ENV_JS}

# Retrieve docks env vars  
for line in $(env | sort);
do
  if [[ $line == "NEXT_PUBLIC_"* ]]; then
    echo $line;
    if printf '%s\n' "$line" | grep -q -e '='; then
      varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
      varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
    fi

    value=$(eval echo \$"$varname")
    [[ -z $value ]] && value=${varvalue}
    
    # Append configuration property to JS file
    echo "  $varname: \"$value\"," >> ${ENV_JS}
  fi
done

# Retrieve .env file vars (if not exists)
while read -r line || [[ -n "$line" ]];
do
  if [[ $line == "NEXT_PUBLIC_"* ]]; then
    if printf '%s\n' "$line" | grep -q -e '='; then
      varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
      varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
    fi

    value=$(eval echo \$"$varname")
    [[ -z $value ]] && value=${varvalue}
    
    # Append configuration property to JS file if not exists
    if ! grep -q $varname "$ENV_JS"; then
      echo "  $varname: \"$value\"," >> ${ENV_JS}
    fi
  fi
done < .env

echo "}" >> ${ENV_JS}
