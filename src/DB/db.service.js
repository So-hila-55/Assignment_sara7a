


export const create = async ({ model, data, options = {} } = {}) => {
    return await model.create([data], options)
}

export const findOne = async ({ model, filter = {}, select = "", options = {} } = {}) => {
    return await model.findOne(filter).select(select).setOptions(options)
}

export const findById = async ({ model, id, select = "", options = {} } = {}) => {
    return await model.findById(id).select(select).setOptions(options)
}

export const find = async ({ model, filter = {}, select = "", options = {} } = {}) => {
    return await model.find(filter).select(select).setOptions(options)
}

export const updateOne = async ({ model, filter = {}, update = {}, options = {} } = {}) => {
    return await model.updateOne(filter, update, options)
}

export const findOneAndUpdate = async ({ model, filter = {}, update = {}, options = { new: true } } = {}) => {
    return await model.findOneAndUpdate(filter, update, options)
}

export const deleteOne = async ({ model, filter = {} } = {}) => {
    return await model.deleteOne(filter)
}

export const findOneAndDelete = async ({ model, filter = {} } = {}) => {
    return await model.findOneAndDelete(filter)
}