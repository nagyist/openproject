#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2024 the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.
#++

module SharingStrategies
  class BaseStrategy
    attr_reader :entity, :user

    def initialize(entity, user: User.current)
      @entity = entity
      @user = user
    end

    def available_roles
      # format: [{ label: "Role name", value: 42, description: "Role description", default: true }]
      raise NotImplementedError, "Override in a subclass and return an array of roles that should be displayed"
    end

    def manageable?
      raise NotImplementedError, "Override in a subclass and return true if the current user can manage sharing"
    end

    def create_contract_class
      raise NotImplementedError, "Override in a subclass and return the contract class for creating a share"
    end

    def update_contract_class
      raise NotImplementedError, "Override in a subclass and return the contract class for updating a share"
    end

    def delete_contract_class
      raise NotImplementedError, "Override in a subclass and return the contract class for deleting a share"
    end

    def custom_body_component?
      additional_body_component.present?
    end

    # Override by returning a component class that should be rendered in the sharing dialog above the table of shares
    def additional_body_component
      nil
    end

    def custom_empty_state_component?
      empty_state_component.present?
    end

    # Override by returning a component class that should be rendered in the sharing dialog instead of the table of shares
    # when there is no share yet
    def empty_state_component
      nil
    end
  end
end
