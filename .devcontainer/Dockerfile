FROM wickr/bot-cloud-alpha:5.68.01.08

LABEL maintainer="wickr <info@wickr.com>"
# Variables
# ENV HOME /home/ubuntu

WORKDIR $HOME


# # Authorize SSH Host
# ARG SSH_KEY
# ENV SSH_KEY=$SSH_KEY

# # Make ssh dir
# RUN mkdir /root/.ssh/
# RUN touch /root/.ssh/id_rsa

# # # Create id_rsa from string arg, and set permissions
# RUN echo "$SSH_KEY" > /root/.ssh/id_rsa
# # RUN chmod 600 /root/.ssh/id_rsa

# # Create known_hosts
# RUN touch /root/.ssh/known_hosts

# # Add git providers to known_hosts
# RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts
# RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
# RUN ssh-keyscan gitlab.com >> /root/.ssh/known_hosts

ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ENV NVM_DIR=/usr/local/nvm

# Create the user
# RUN groupadd --gid $USER_GID $USERNAME \
#   && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
#   #
#   # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
#   && apt-get update \
#   && apt-get install -y sudo \
#   && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
#   && chmod 0440 /etc/sudoers.d/$USERNAME


# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.
# USER $USERNAME
# COPY integrations /usr/lib/wickr/integrations/software
ARG DEBIAN_FRONTEND=noninteractive
RUN mkdir /usr/local/wickr/WickrIO 
# COPY clientConfig.json /usr/local/wickr/WickrIO/
# \
# && cp clientConfig.json /usr/local/wickr/WickrIO/
ENV LANG en_US.utf8
ENV HOME /home/ubuntu
ARG DEBIAN_FRONTEND=readline
# Install zsh
RUN apt-get update && apt-get -y install curl zsh git 
RUN zsh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" ||true

# RUN ln -f /bin/zsh /bin/sh

ENV PATH=${PATH}:/usr/local/share/npm-global/bin

RUN  apt-get update \
  && echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \ 
  && apt-get install -yq \ 
  software-properties-common fonts-powerline fonts-firacode

# Update new packages
# Get Ubuntu packages
RUN apt-get update \ 
  && apt install -y build-essential pkg-config libssl-dev wget ca-certificates gcc libc6-dev 

RUN curl -fsSL https://starship.rs/install.sh | bash -s -- -y

RUN echo 'eval "$(starship init zsh)"' >> /home/ubuntu/.zshrc
RUN echo 'eval "$(ssh-agent -s)"' >> /home/ubuntu/.zshrc
RUN echo '. /usr/local/nvm/nvm.sh' >> /home/ubuntu/.zshrc

# RUN echo '[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh' >> /home/ubuntu/.zshrc

# ENTRYPOINT ["zsh"]
# SHELL ["/bin/zsh", "-c"]


# Start the processes
# CMD "/home/ubuntu/start.sh"

ENV DEBIAN_FRONTEND=dialog