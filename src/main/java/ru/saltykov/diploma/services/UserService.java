package ru.saltykov.diploma.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.repositories.CollabUserRepository;
import ru.saltykov.diploma.repositories.RoleRepository;

@Service
public class UserService implements UserDetailsService {
    @Autowired
    CollabUserRepository collabUserRepository;
    @Autowired
    RoleRepository roleRepository;
    @Autowired
    PasswordEncoder encoder;

    @Transactional
    public CollabUser addUser(String username, String displayname, String password){
        if (collabUserRepository.findUserByUsername(username) != null)
            return null;

        CollabUser user = new CollabUser();
        user.setUsername(username);
        user.setDisplayname(displayname);
        user.setPassword(encoder.encode(password));
        collabUserRepository.insertUser(user);

        roleRepository.addRoleToUser(user.getId(), 1);

        return user;
    }
    public CollabUser getUserByUsername(String username) {
        return collabUserRepository.findUserByUsername(username);
    }
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return collabUserRepository.findUserByUsername(username);
    }
}
